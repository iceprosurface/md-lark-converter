import React from 'react';

function DebugComparison({ ourData, larkData }) {
  if (!ourData || !larkData) {
    return (
      <div className="text-sm text-white/60">
        需要对比数据后才能显示
      </div>
    );
  }

  const comparison = compareData(ourData, larkData);

  return (
    <div className="space-y-4">
      <div className="bg-black/30 border border-white/10 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">数据对比</h3>
        <div className="space-y-2 text-xs">
          {comparison.map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className={item.match ? 'text-green-400' : 'text-red-400'}>
                {item.match ? '✓' : '✗'}
              </span>
              <div className="flex-1">
                <div className="text-white/90 font-medium">{item.field}</div>
                {item.ours && (
                  <div className="text-blue-300 mt-1">
                    我们: {JSON.stringify(item.ours)}
                  </div>
                )}
                {item.lark && (
                  <div className="text-yellow-300 mt-1">
                    飞书: {JSON.stringify(item.lark)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-black/30 border border-white/10 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">HTML 对比</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-blue-300 mb-2">我们的 HTML</div>
            <div className="text-xs text-white/70 whitespace-pre-wrap break-all max-h-60 overflow-auto">
              {generateComparisonHtml(ourData)}
            </div>
          </div>
          <div>
            <div className="text-xs text-yellow-300 mb-2">飞书 HTML（示例）</div>
            <div className="text-xs text-white/70 whitespace-pre-wrap break-all max-h-60 overflow-auto">
              {generateSampleLarkHtml(larkData)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function compareData(ours, lark) {
  const comparisons = [];

  comparisons.push({
    field: '根 ID 格式',
    ours: { rootId: ours.rootId },
    lark: { rootId: lark.rootId },
    match: ours.rootId.match(/^Wqf[a-z0-9_]+$/)
  });

  comparisons.push({
    field: 'isCut',
    ours: { isCut: ours.isCut },
    lark: { isCut: lark.isCut },
    match: ours.isCut === lark.isCut
  });

  comparisons.push({
    field: 'isKeepQuoteContainer',
    ours: { isKeepQuoteContainer: ours.isKeepQuoteContainer },
    lark: { isKeepQuoteContainer: lark.isKeepQuoteContainer },
    match: ours.isKeepQuoteContainer === lark.isKeepQuoteContainer
  });

  const ourIsvBlocks = Object.values(ours.recordMap).filter(r => r.snapshot.type === 'isv');
  const larkIsvBlocks = Object.values(lark.recordMap).filter(r => r.snapshot.type === 'isv');

  comparisons.push({
    field: 'ISV_BLOCK 数量',
    ours: { count: ourIsvBlocks.length },
    lark: { count: larkIsvBlocks.length },
    match: ourIsvBlocks.length === larkIsvBlocks.length
  });

  if (ourIsvBlocks.length > 0) {
    const ourFirstIsv = ourIsvBlocks[0];
    const larkFirstIsv = larkIsvBlocks[0];

    comparisons.push({
      field: 'ISV_BLOCK.type',
      ours: { type: ourFirstIsv.snapshot.type },
      lark: { type: larkFirstIsv.snapshot.type },
      match: ourFirstIsv.snapshot.type === larkFirstIsv.snapshot.type
    });

    comparisons.push({
      field: 'ISV_BLOCK.block_type_id',
      ours: { block_type_id: ourFirstIsv.snapshot.block_type_id },
      lark: { block_type_id: larkFirstIsv.snapshot.block_type_id },
      match: ourFirstIsv.snapshot.block_type_id === larkFirstIsv.snapshot.block_type_id
    });

    comparisons.push({
      field: 'ISV_BLOCK.manifest',
      ours: { manifest: ourFirstIsv.snapshot.manifest },
      lark: { manifest: larkFirstIsv.snapshot.manifest },
      match: JSON.stringify(ourFirstIsv.snapshot.manifest) === JSON.stringify(larkFirstIsv.snapshot.manifest)
    });

    comparisons.push({
      field: 'ISV_BLOCK.data.view',
      ours: { view: ourFirstIsv.snapshot.data?.view },
      lark: { view: larkFirstIsv.snapshot.data?.view },
      match: ourFirstIsv.snapshot.data?.view === larkFirstIsv.snapshot.data?.view
    });

    comparisons.push({
      field: 'ISV_BLOCK.data.theme',
      ours: { theme: ourFirstIsv.snapshot.data?.theme },
      lark: { theme: larkFirstIsv.snapshot.data?.theme },
      match: ourFirstIsv.snapshot.data?.theme === larkFirstIsv.snapshot.data?.theme
    });
  }

  comparisons.push({
    field: 'extra.channel',
    ours: { channel: ours.extra?.channel },
    lark: { channel: lark.extra?.channel },
    match: ours.extra?.channel === lark.extra?.channel
  });

  comparisons.push({
    field: 'extra.isEqualBlockSelection',
    ours: { isEqualBlockSelection: ours.extra?.isEqualBlockSelection },
    lark: { isEqualBlockSelection: lark.extra?.isEqualBlockSelection },
    match: ours.extra?.isEqualBlockSelection === lark.extra?.isEqualBlockSelection
  });

  return comparisons;
}

function generateComparisonHtml(data) {
  const jsonStr = JSON.stringify(data);
  const encodedJson = jsonStr
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  let html = `<meta charset="utf-8"><meta charset="utf-8"><div data-page-id="${data.rootId}" data-lark-html-role="root" data-docx-has-block-data="true">`;

  for (const recordId of data.recordIds.slice(0, 3)) {
    const record = data.recordMap[recordId];
    if (!record) continue;

    const snapshot = record.snapshot;
    if (snapshot.type === 'isv') {
      const metaProps = {
        blockId: recordId,
        blockType: 'ISV_BLOCK',
        props: {
          data: {
            blockTypeId: 'blk_631fefbbae02400430b8f9f4',
            AppBlockId: ''
          }
        }
      };
      const metaPropsStr = JSON.stringify(metaProps)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      html += `<span class="block-id-${recordId} block-type-ISV_BLOCK block-placeholder">
<div class="j-block-container">
<span data-meta-block-props="${metaPropsStr}">
<span class="block-autonomous-region dom-pass-empty-check ignore-collect">
<span class="block-paste-placeholder">暂时无法在飞书文档外展示此内容</span>
</span>
</span>
</div>
</span>`;
    }
  }

  html += `...<span data-lark-record-data="${encodedJson}" data-lark-record-format="docx/record" class="lark-record-clipboard"></span>`;
  return html;
}

  function generateSampleLarkHtml(data) {
    const jsonStr = JSON.stringify(data);
    const encodedJson = jsonStr
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return `<meta charset="utf-8"><div data-page-id="${data.rootId}" data-lark-html-role="root" data-docx-has-block-data="true">...<span data-lark-record-data="${encodedJson}" data-lark-record-format="docx/record" class="lark-record-clipboard"></span>`;
  }

export default DebugComparison;
